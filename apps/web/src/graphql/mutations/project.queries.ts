import { gql } from "@apollo/client";

const PROJECT_CORE_FIELDS = `
  id
  code
  name
  description
  partnerId
  status
  budget
  currency
  plannedStartDate
  plannedEndDate
  actualStartDate
  actualEndDate
  notes
  createdById
  createdAt
  updatedAt
  partner { id name cui }
  createdBy { id firstName lastName email }
`;

export const GET_PROJECTS_QUERY = gql`
  query GetProjects($filter: ProjectsFilterInput) {
    projects(filter: $filter) {
      ${PROJECT_CORE_FIELDS}
      members {
        id
        role
        joinedAt
        user { id firstName lastName email }
      }
    }
  }
`;

export const GET_PROJECT_QUERY = gql`
  query GetProject($projectId: String!) {
    project(projectId: $projectId) {
      ${PROJECT_CORE_FIELDS}
      members {
        id
        userId
        role
        joinedAt
        leftAt
        user { id firstName lastName email }
      }
    }
  }
`;

export const GET_PROJECT_COST_ROLLUP_QUERY = gql`
  query GetProjectCostRollup($projectId: String!) {
    projectCostRollup(projectId: $projectId) {
      budget
      materialsCost
      vehicleCost
      totalActual
      remaining
      currency
    }
  }
`;

export const GET_PROJECT_MEMBERS_QUERY = gql`
  query GetProjectMembers($projectId: String!) {
    projectMembers(projectId: $projectId) {
      id
      projectId
      userId
      role
      joinedAt
      leftAt
      user { id firstName lastName email }
    }
  }
`;

export const GET_PROJECT_MATERIALS_QUERY = gql`
  query GetProjectMaterials($projectId: String!) {
    projectMaterials(projectId: $projectId) {
      id
      projectId
      productId
      warehouseId
      requestedQty
      reservedQty
      issuedQty
      unitCost
      status
      notes
      createdAt
      updatedAt
      product { id sku name unit unitPrice currentStock }
      warehouse { id code name }
    }
  }
`;

export const GET_PROJECT_VEHICLES_QUERY = gql`
  query GetProjectVehicles($projectId: String!) {
    projectVehicles(projectId: $projectId) {
      id
      projectId
      vehicleId
      startDate
      endDate
      notes
      createdAt
      vehicle { id plateNumber brand model }
    }
  }
`;

export const GET_PROJECT_TASKS_QUERY = gql`
  query GetProjectTasks($projectId: String!) {
    projectTasks(projectId: $projectId) {
      id
      projectId
      title
      description
      assigneeId
      status
      priority
      dueDate
      completedAt
      createdById
      createdAt
      updatedAt
      assignee { id firstName lastName }
      createdBy { id firstName lastName }
    }
  }
`;

export const GET_PROJECT_FEED_QUERY = gql`
  query GetProjectFeed($projectId: String!, $kind: ProjectFeedKind) {
    projectFeed(projectId: $projectId, kind: $kind) {
      id
      projectId
      kind
      authorId
      content
      attachmentUrl
      attachmentName
      metadata
      createdAt
      author { id firstName lastName }
    }
  }
`;

export const GET_MY_PROJECT_TASKS_QUERY = gql`
  query GetMyProjectTasks {
    myProjectTasks {
      id
      projectId
      title
      status
      priority
      dueDate
      createdAt
    }
  }
`;

export const GET_CURRENT_PROJECT_FOR_VEHICLE_QUERY = gql`
  query GetCurrentProjectForVehicle($vehicleId: String!) {
    currentProjectForVehicle(vehicleId: $vehicleId) {
      id
      code
      name
    }
  }
`;

export const GET_PROJECT_COSTS_FOR_INVOICE_QUERY = gql`
  query GetProjectCostsForInvoice($projectId: String!) {
    projectCostsForInvoice(projectId: $projectId) {
      description
      quantity
      unit
      unitPrice
      vatRate
      source
    }
  }
`;

export const GET_PROJECT_TASK_COMMENTS_QUERY = gql`
  query GetProjectTaskComments($taskId: String!) {
    projectTaskComments(taskId: $taskId) {
      id
      taskId
      authorId
      content
      createdAt
      updatedAt
      author { id firstName lastName }
    }
  }
`;

export const GET_PROJECT_TASK_ACTIVITY_QUERY = gql`
  query GetProjectTaskActivity($taskId: String!) {
    projectTaskActivity(taskId: $taskId) {
      id
      projectId
      kind
      authorId
      content
      metadata
      createdAt
      author { id firstName lastName }
    }
  }
`;
