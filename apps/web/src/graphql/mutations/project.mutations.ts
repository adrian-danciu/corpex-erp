import { gql } from "@apollo/client";

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      code
      name
      status
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      id
      name
      description
      budget
      currency
      plannedStartDate
      plannedEndDate
      notes
      updatedAt
    }
  }
`;

export const TRANSITION_PROJECT_STATUS_MUTATION = gql`
  mutation TransitionProjectStatus($input: TransitionProjectStatusInput!) {
    transitionProjectStatus(input: $input) {
      id
      status
      actualStartDate
      actualEndDate
    }
  }
`;

export const ADD_PROJECT_MEMBER_MUTATION = gql`
  mutation AddProjectMember($input: AddProjectMemberInput!) {
    addProjectMember(input: $input) {
      id
      role
      joinedAt
      user { id firstName lastName email }
    }
  }
`;

export const UPDATE_PROJECT_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateProjectMemberRole($input: UpdateProjectMemberRoleInput!) {
    updateProjectMemberRole(input: $input) {
      id
      role
    }
  }
`;

export const REMOVE_PROJECT_MEMBER_MUTATION = gql`
  mutation RemoveProjectMember($input: RemoveProjectMemberInput!) {
    removeProjectMember(input: $input) {
      id
      leftAt
    }
  }
`;

export const ALLOCATE_PROJECT_MATERIAL_MUTATION = gql`
  mutation AllocateProjectMaterial($input: AllocateProjectMaterialInput!) {
    allocateProjectMaterial(input: $input) {
      id
      issuedQty
      unitCost
      status
    }
  }
`;

export const REMOVE_PROJECT_MATERIAL_MUTATION = gql`
  mutation RemoveProjectMaterial($input: RemoveProjectMaterialInput!) {
    removeProjectMaterial(input: $input) {
      id
      status
    }
  }
`;

export const ASSIGN_PROJECT_VEHICLE_MUTATION = gql`
  mutation AssignProjectVehicle($input: AssignProjectVehicleInput!) {
    assignProjectVehicle(input: $input) {
      id
      vehicleId
      startDate
      endDate
      vehicle { id plateNumber brand model }
    }
  }
`;

export const END_PROJECT_VEHICLE_ASSIGNMENT_MUTATION = gql`
  mutation EndProjectVehicleAssignment($input: EndProjectVehicleAssignmentInput!) {
    endProjectVehicleAssignment(input: $input) {
      id
      endDate
    }
  }
`;

export const CREATE_PROJECT_TASK_MUTATION = gql`
  mutation CreateProjectTask($input: CreateProjectTaskInput!) {
    createProjectTask(input: $input) {
      id
      title
      status
      priority
      assigneeId
      dueDate
    }
  }
`;

export const UPDATE_PROJECT_TASK_MUTATION = gql`
  mutation UpdateProjectTask($input: UpdateProjectTaskInput!) {
    updateProjectTask(input: $input) {
      id
      title
      description
      priority
      assigneeId
      dueDate
    }
  }
`;

export const TRANSITION_PROJECT_TASK_MUTATION = gql`
  mutation TransitionProjectTask($input: TransitionProjectTaskInput!) {
    transitionProjectTask(input: $input) {
      id
      status
      completedAt
    }
  }
`;

export const CREATE_PROJECT_FEED_POST_MUTATION = gql`
  mutation CreateProjectFeedPost($input: CreateFeedPostInput!) {
    createProjectFeedPost(input: $input) {
      id
      content
      attachmentUrl
      attachmentName
      createdAt
      author { id firstName lastName }
    }
  }
`;

export const DELETE_PROJECT_FEED_ENTRY_MUTATION = gql`
  mutation DeleteProjectFeedEntry($input: DeleteFeedEntryInput!) {
    deleteProjectFeedEntry(input: $input) {
      id
      deletedAt
    }
  }
`;
