const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../supabase/migrations/20260620083500_805cd79b-2805-4024-bc0d-83005fb17de7.sql');
let sql = fs.readFileSync(filePath, 'utf8');

// Test matching and replacing current_association_id function with strict ending
const regex = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.current_association_id\(\)[\s\S]*?LIMIT\s+1;\s*\$\$;/gi;
const match = sql.match(regex);
console.log('Match found:', !!match);

if (match) {
  sql = sql.replace(regex, `
CREATE OR REPLACE FUNCTION public.current_association_id()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _assoc_id uuid;
BEGIN
  SELECT association_id FROM public.memberships
  WHERE user_id = auth.uid()
  ORDER BY is_default DESC, created_at ASC
  LIMIT 1 INTO _assoc_id;
  
  IF _assoc_id IS NULL THEN
    SELECT id FROM public.associations LIMIT 1 INTO _assoc_id;
  END IF;
  
  RETURN _assoc_id;
END;
$$;
  `);
  console.log('--- REPLACED FUNCTION ---');
  console.log(sql.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.current_association_id\(\)[\s\S]*?\$\$;/gi)[0]);
}
