import { gql } from "@apollo/client";

export const PROJECT_TASK_FRAGMENT = gql`
  fragment ProjectTaskFields on ProjectTask {
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
    assignee {
      id
      firstName
      lastName
    }
    createdBy {
      id
      firstName
      lastName
    }
  }
`;
