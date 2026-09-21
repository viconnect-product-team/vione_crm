-- BC-4.1V — Harden Relationship Graph grants to match frozen spec.
-- 1) Restrict helper EXECUTE to authenticated + service_role only.
--    Prior grants leaked EXECUTE to PUBLIC/anon (default PL/pgSQL EXECUTE-to-PUBLIC).
--    RLS still gated data because policies scope to `authenticated`, but the spec
--    (GRAPH_RLS_IMPLEMENTATION.md) requires REVOKE FROM PUBLIC and explicit grants.
REVOKE ALL ON FUNCTION public.graph_can_read_node(public.graph_nodes) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.graph_can_read_node_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.graph_user_owns_node(public.graph_nodes) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.graph_user_in_scope(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.graph_can_read_node(public.graph_nodes) FROM anon;
REVOKE ALL ON FUNCTION public.graph_can_read_node_id(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.graph_user_owns_node(public.graph_nodes) FROM anon;
REVOKE ALL ON FUNCTION public.graph_user_in_scope(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.graph_can_read_node(public.graph_nodes) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.graph_can_read_node_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.graph_user_owns_node(public.graph_nodes) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.graph_user_in_scope(text, uuid) TO authenticated, service_role;

-- 2) Restrict table privileges to SELECT for authenticated; revoke anon entirely.
--    Writes remain blocked (no write policies under forced RLS), but the frozen
--    contract requires read-only exposure in BC-4.1.
REVOKE ALL ON public.graph_nodes FROM anon, authenticated;
REVOKE ALL ON public.graph_edges FROM anon, authenticated;
REVOKE ALL ON public.graph_registry_versions FROM anon, authenticated;
GRANT SELECT ON public.graph_nodes TO authenticated;
GRANT SELECT ON public.graph_edges TO authenticated;
GRANT SELECT ON public.graph_registry_versions TO authenticated;
GRANT ALL ON public.graph_nodes TO service_role;
GRANT ALL ON public.graph_edges TO service_role;
GRANT ALL ON public.graph_registry_versions TO service_role;