import { gql } from "@apollo/client";

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($changePasswordInput: ChangePasswordInput!) {
    changePassword(changePasswordInput: $changePasswordInput) {
      id
      email
      firstName
      lastName
      role
    }
  }
`;

export const UPDATE_PROFILE_PICTURE_MUTATION = gql`
  mutation UpdateProfilePicture(
    $updateProfilePictureInput: UpdateProfilePictureInput!
  ) {
    updateProfilePicture(
      updateProfilePictureInput: $updateProfilePictureInput
    ) {
      id
      email
      firstName
      lastName
      profilePicture
      role
    }
  }
`;
