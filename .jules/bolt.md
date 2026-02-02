## 2026-02-02 - Client-side Filtering Bottlenecks
**Learning:** The application performs client-side filtering and aggregation on potentially large datasets (Invoices, Partners) within the render cycle. This causes UI lag during input typing.
**Action:** Use `useDeferredValue` for search inputs and `useMemo` for filtering/aggregation to decouple input responsiveness from data processing.
