CREATE TABLE "membership_accounts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_requests" (
	"user_id" text NOT NULL,
	"request_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"period" text NOT NULL,
	"features" jsonb NOT NULL,
	"state" text NOT NULL,
	"lease_until" timestamp with time zone NOT NULL,
	"response" jsonb,
	"response_status" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_requests_user_id_request_id_pk" PRIMARY KEY("user_id","request_id"),
	CONSTRAINT "membership_requests_state_check" CHECK ("membership_requests"."state" IN ('pending','completed','released'))
);
--> statement-breakpoint
CREATE TABLE "membership_usage" (
	"user_id" text NOT NULL,
	"period" text NOT NULL,
	"feature" text NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "membership_usage_user_id_period_feature_pk" PRIMARY KEY("user_id","period","feature"),
	CONSTRAINT "membership_usage_feature_check" CHECK ("membership_usage"."feature" IN ('chat','recipes','scans','plans')),
	CONSTRAINT "membership_usage_used_check" CHECK ("membership_usage"."used" >= 0)
);
--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_user_id_membership_accounts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."membership_accounts"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_usage" ADD CONSTRAINT "membership_usage_user_id_membership_accounts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."membership_accounts"("user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- Lock each account before changing usage; safe across API processes with Neon HTTP.
CREATE FUNCTION membership_reserve(p_user text, p_id text, p_hash text, p_period text,
  p_features jsonb, p_limits jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r membership_requests%ROWTYPE; f text; n integer; reserved integer;
BEGIN
  INSERT INTO membership_accounts(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM membership_accounts WHERE user_id=p_user FOR UPDATE;
  UPDATE membership_requests SET state='released' WHERE user_id=p_user AND state='pending' AND lease_until <= now();
  UPDATE membership_requests SET response=NULL WHERE user_id=p_user AND response IS NOT NULL AND created_at < now()-interval '24 hours';
  SELECT * INTO r FROM membership_requests WHERE user_id=p_user AND request_id=p_id;
  IF FOUND THEN
    IF r.fingerprint <> p_hash THEN RETURN jsonb_build_object('kind','conflict'); END IF;
    IF r.state='completed' THEN
      IF r.response IS NULL THEN RETURN jsonb_build_object('kind','expired'); END IF;
      RETURN jsonb_build_object('kind','replay','body',r.response,'status',r.response_status);
    END IF;
    IF r.state='pending' THEN RETURN jsonb_build_object('kind','pending'); END IF;
    RETURN jsonb_build_object('kind','released');
  END IF;
  FOR f IN SELECT jsonb_array_elements_text(p_features) LOOP
    SELECT COALESCE((SELECT used FROM membership_usage WHERE user_id=p_user AND period=p_period AND feature=f),0) INTO n;
    SELECT count(*) INTO reserved FROM membership_requests
      WHERE user_id=p_user AND period=p_period AND state='pending' AND features ? f;
    IF n + reserved >= (p_limits->>f)::integer THEN RETURN jsonb_build_object('kind','quota','feature',f); END IF;
  END LOOP;
  INSERT INTO membership_requests(user_id,request_id,fingerprint,period,features,state,lease_until)
    VALUES(p_user,p_id,p_hash,p_period,p_features,'pending',now()+interval '180 seconds');
  RETURN jsonb_build_object('kind','reserved');
END $$;
--> statement-breakpoint
CREATE FUNCTION membership_settle(p_user text,p_id text,p_feature text,p_body jsonb,p_status integer)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE r membership_requests%ROWTYPE;
BEGIN
  PERFORM 1 FROM membership_accounts WHERE user_id=p_user FOR UPDATE;
  SELECT * INTO r FROM membership_requests WHERE user_id=p_user AND request_id=p_id FOR UPDATE;
  IF NOT FOUND OR r.state <> 'pending' THEN RETURN false; END IF;
  IF r.lease_until <= now() THEN
    UPDATE membership_requests SET state='released' WHERE user_id=p_user AND request_id=p_id;
    RETURN false;
  END IF;
  IF p_feature IS NOT NULL THEN
    IF NOT (r.features ? p_feature) THEN RAISE EXCEPTION 'Unreserved feature'; END IF;
    INSERT INTO membership_usage(user_id,period,feature,used) VALUES(p_user,r.period,p_feature,1)
      ON CONFLICT(user_id,period,feature) DO UPDATE SET used=membership_usage.used+1;
    UPDATE membership_requests SET state='completed',response=p_body,response_status=p_status WHERE user_id=p_user AND request_id=p_id;
  ELSE
    UPDATE membership_requests SET state='released' WHERE user_id=p_user AND request_id=p_id;
  END IF;
  RETURN true;
END $$;
