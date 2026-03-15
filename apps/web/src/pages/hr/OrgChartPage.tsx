import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import Tree from "react-d3-tree";
import type { RawNodeDatum, CustomNodeElementProps } from "react-d3-tree";
import { GET_ORG_CHART_QUERY } from "@/graphql/mutations/employee.mutations";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  managerId: string | null;
}

interface OrgNode extends RawNodeDatum {
  attributes: Record<string, string>;
}

function buildTree(employees: OrgEmployee[]): OrgNode {
  const map = new Map<string, OrgNode>();

  for (const e of employees) {
    map.set(e.id, {
      name: `${e.firstName} ${e.lastName}`,
      attributes: {
        position: e.position,
        department: e.department,
      },
      children: [],
    });
  }

  const roots: OrgNode[] = [];

  for (const e of employees) {
    const node = map.get(e.id)!;
    if (e.managerId && map.has(e.managerId)) {
      const parent = map.get(e.managerId)!;
      (parent.children as OrgNode[]).push(node);
    } else {
      roots.push(node);
    }
  }

  if (roots.length === 1) return roots[0];

  return {
    name: "CORPEX",
    attributes: { position: "Organisation", department: "" },
    children: roots,
  };
}

function OrgNode({ nodeDatum }: CustomNodeElementProps) {
  const attrs = nodeDatum.attributes as Record<string, string> | undefined;
  const isRoot = !attrs?.department;
  const cardWidth = 160;
  const cardHeight = isRoot ? 44 : 68;

  return (
    <g>
      <rect
        x={-cardWidth / 2}
        y={-cardHeight / 2}
        width={cardWidth}
        height={cardHeight}
        rx={8}
        ry={8}
        fill={isRoot ? "#0f172a" : "white"}
        stroke={isRoot ? "#0f172a" : "#e2e8f0"}
        strokeWidth={1.5}
        filter="drop-shadow(0 1px 3px rgba(0,0,0,0.10))"
      />
      <text
        textAnchor="middle"
        y={isRoot ? 5 : -10}
        fill={isRoot ? "white" : "#0f172a"}
        fontSize={12}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="600"
      >
        {nodeDatum.name}
      </text>
      {attrs?.position && !isRoot && (
        <text
          textAnchor="middle"
          y={8}
          fill="#475569"
          fontSize={10}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {attrs.position}
        </text>
      )}
      {attrs?.department && !isRoot && (
        <text
          textAnchor="middle"
          y={22}
          fill="#94a3b8"
          fontSize={9}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {attrs.department}
        </text>
      )}
    </g>
  );
}

export default function OrgChartPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading, error } = useQuery<{
    employees: { items: OrgEmployee[] };
  }>(GET_ORG_CHART_QUERY);

  const renderNode = useCallback(
    (props: CustomNodeElementProps) => <OrgNode {...props} />,
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load org chart</p>
      </div>
    );
  }

  const employees = data?.employees.items ?? [];

  if (employees.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/hr/employees")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Button>
        <p className="text-center text-slate-500 py-12">No employees found.</p>
      </div>
    );
  }

  const treeData = buildTree(employees);
  const containerWidth = containerRef.current?.clientWidth ?? 900;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center gap-4 px-1 pb-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/hr/employees")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organisation Chart</h1>
          <p className="text-slate-500 text-sm mt-0.5">Drag to pan · Scroll to zoom</p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
      >
        <Tree
          data={treeData}
          orientation="vertical"
          translate={{ x: containerWidth / 2, y: 80 }}
          nodeSize={{ x: 200, y: 120 }}
          separation={{ siblings: 1.2, nonSiblings: 1.6 }}
          renderCustomNodeElement={renderNode}
          pathFunc="step"
          pathClassFunc={() => "stroke-slate-300"}
          zoom={0.8}
          enableLegacyTransitions
          collapsible={false}
        />
      </div>
    </div>
  );
}
