ALTER TABLE "meal_plans" ADD COLUMN "cooked_meals" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
CREATE FUNCTION complete_pantry_meal(p_user text, p_plan integer, p_day integer, p_consumed jsonb, p_feedback text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  saved meal_plans%ROWTYPE;
  stock pantry%ROWTYPE;
  meal jsonb;
  entry jsonb;
  receipt jsonb;
  quantity_used numeric;
  ingredient_name text;
  base_unit text;
BEGIN
  -- Serialize repeats of the same meal and edits to completion history.
  SELECT * INTO saved FROM meal_plans WHERE id = p_plan AND user_id = p_user FOR UPDATE;
  IF NOT FOUND OR saved.saved_at IS NULL OR p_day NOT BETWEEN 1 AND 3 THEN
    RAISE EXCEPTION 'Saved meal not found' USING ERRCODE = 'P0002';
  END IF;
  IF saved.cooked_meals ? p_day::text THEN RETURN saved.cooked_meals -> p_day::text; END IF;
  SELECT value INTO meal FROM jsonb_array_elements(saved.plan -> 'meals') WHERE (value ->> 'day')::integer = p_day;
  IF meal IS NULL THEN RAISE EXCEPTION 'Meal not found' USING ERRCODE = 'P0002'; END IF;
  IF jsonb_typeof(p_consumed) <> 'array' OR jsonb_array_length(p_consumed) > 90 OR length(p_feedback) > 500 THEN
    RAISE EXCEPTION 'Invalid completion';
  END IF;
  IF (SELECT count(*) <> count(DISTINCT value ->> 'pantryItemId') FROM jsonb_array_elements(p_consumed)) THEN
    RAISE EXCEPTION 'Duplicate ingredient';
  END IF;
  -- Stable lock order also serializes different plans using the same pantry rows.
  PERFORM id FROM pantry WHERE user_id = p_user AND id IN (
    SELECT (value ->> 'pantryItemId')::integer FROM jsonb_array_elements(p_consumed)
  ) ORDER BY id FOR UPDATE;
  FOR entry IN SELECT value FROM jsonb_array_elements(p_consumed) LOOP
    SELECT i ->> 'name', a ->> 'unit' INTO ingredient_name, base_unit
      FROM jsonb_array_elements(meal -> 'ingredients') i,
        jsonb_array_elements(i -> 'allocations') a
      WHERE (a ->> 'pantryItemId')::integer = (entry ->> 'pantryItemId')::integer LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'Ingredient not allocated to this meal'; END IF;
    quantity_used := (entry ->> 'quantity')::numeric;
    IF quantity_used IS NULL OR quantity_used < 0 OR quantity_used > 999999999.999 OR quantity_used <> round(quantity_used, 3) THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;
    -- Zero means the user did not consume this pantry item; removed items are allowed.
    IF quantity_used = 0 THEN CONTINUE; END IF;
    SELECT * INTO stock FROM pantry WHERE id = (entry ->> 'pantryItemId')::integer AND user_id = p_user;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pantry item missing'; END IF;
    IF stock.name <> entry ->> 'name' OR stock.unit <> entry ->> 'unit' OR stock.quantity < quantity_used
      OR lower(regexp_replace(trim(stock.name), '\s+', ' ', 'g')) <> lower(regexp_replace(trim(ingredient_name), '\s+', ' ', 'g'))
      OR (CASE stock.unit WHEN 'kg' THEN 'g' WHEN 'l' THEN 'ml' WHEN 'cups' THEN 'tsp' WHEN 'tbsp' THEN 'tsp' ELSE stock.unit END) <> base_unit THEN
      RAISE EXCEPTION 'Pantry item changed or insufficient';
    END IF;
    UPDATE pantry SET quantity = quantity - quantity_used WHERE id = stock.id AND user_id = p_user;
    DELETE FROM pantry WHERE id = stock.id AND user_id = p_user AND quantity = 0;
  END LOOP;
  receipt := jsonb_build_object('completedAt', now(), 'consumed', p_consumed, 'feedback', p_feedback);
  UPDATE meal_plans SET cooked_meals = cooked_meals || jsonb_build_object(p_day::text, receipt) WHERE id = p_plan AND user_id = p_user;
  RETURN receipt;
END;
$$;
