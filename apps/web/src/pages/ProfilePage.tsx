import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { User as UserType } from "@/types/auth.types";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { CHANGE_PASSWORD_MUTATION, UPDATE_PROFILE_PICTURE_MUTATION } from "@/graphql/mutations/profile.mutations";
import { User, Camera } from "lucide-react";

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfilePictureFormValues {
  profilePicture: string;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [pictureError, setPictureError] = useState("");
  const [pictureSuccess, setPictureSuccess] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    control: passwordControl,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    register: registerPicture,
    handleSubmit: handleSubmitPicture,
    reset: resetPictureForm,
    formState: { errors: pictureErrors },
  } = useForm<ProfilePictureFormValues>({
    defaultValues: {
      profilePicture: user?.profilePicture || "",
    },
  });

  const newPassword = useWatch({ control: passwordControl, name: "newPassword" });

  // Mutations
  const [changePasswordMutation, { loading: changingPassword }] =
    useMutationWithToast(CHANGE_PASSWORD_MUTATION, {
      successMessage: "Password updated",
      onCompleted: () => {
        setPasswordSuccess(true);
        resetPasswordForm();
        setTimeout(() => setPasswordSuccess(false), 5000);
      },
    });

  const [updateProfilePictureMutation, { loading: updatingPicture }] =
    useMutationWithToast<{ updateProfilePicture: UserType }>(
      UPDATE_PROFILE_PICTURE_MUTATION,
      {
        successMessage: "Profile picture updated",
        onCompleted: (data) => {
          updateUser(data.updateProfilePicture);
          setPictureSuccess(true);
          setTimeout(() => setPictureSuccess(false), 5000);
        },
      },
    );

  // Handle password change
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordSuccess(false);

    try {
      await changePasswordMutation({
        variables: {
          changePasswordInput: {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          },
        },
      });
    } catch (error) {
      console.error("Password change error:", error);
    }
  };

  // Handle profile picture update
  const onProfilePictureSubmit = async (values: ProfilePictureFormValues) => {
    setPictureError("");
    setPictureSuccess(false);

    // Validate URL format (basic validation)
    if (values.profilePicture && !values.profilePicture.match(/^https?:\/\/.+/)) {
      setPictureError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    try {
      await updateProfilePictureMutation({
        variables: {
          updateProfilePictureInput: {
            profilePicture: values.profilePicture || null,
          },
        },
      });
    } catch (error) {
      console.error("Profile picture update error:", error);
    }
  };

  // Handle remove profile picture
  const handleRemoveProfilePicture = async () => {
    setPictureError("");
    setPictureSuccess(false);
    resetPictureForm({ profilePicture: "" });

    try {
      await updateProfilePictureMutation({
        variables: {
          updateProfilePictureInput: {
            profilePicture: null,
          },
        },
      });
    } catch (error) {
      console.error("Profile picture removal error:", error);
    }
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-slate-500 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information - Read Only */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 border">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-sm">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Name cannot be changed. Contact your administrator if you need to update it.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="px-3 py-2 rounded-md bg-slate-50 border">
                <span className="text-sm">{user?.email}</span>
              </div>
              <p className="text-xs text-slate-500">
                Email cannot be changed for security reasons
              </p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="px-3 py-2 rounded-md bg-slate-50 border">
                <span className="text-sm capitalize">
                  {user?.role.toLowerCase()}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs text-slate-500">
                Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </p>
              <p className="text-xs text-slate-500">
                Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {/* Avatar Preview */}
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground border-2 border-slate-200">
                  {initials}
                </div>
              )}

              {pictureSuccess && (
                <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
                  Profile picture updated successfully!
                </div>
              )}

              {pictureError && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                  {pictureError || pictureErrors.profilePicture?.message}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitPicture(onProfilePictureSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profilePicture">Profile Picture URL</Label>
                <Input
                  id="profilePicture"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  {...registerPicture("profilePicture", {
                    validate: (value) =>
                      !value ||
                      /^https?:\/\/.+/.test(value) ||
                      "Please enter a valid URL starting with http:// or https://",
                  })}
                />
                <p className="text-xs text-slate-500">
                  Enter a URL to an image for your profile picture
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updatingPicture}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {updatingPicture ? "Updating..." : "Update Picture"}
                </Button>
                {user?.profilePicture && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveProfilePicture}
                    disabled={updatingPicture}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              Password changed successfully!
            </div>
          )}

          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  className={passwordErrors.currentPassword ? "border-red-500" : ""}
                  {...registerPassword("currentPassword", {
                    required: "Current password is required",
                  })}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  className={passwordErrors.newPassword ? "border-red-500" : ""}
                  {...registerPassword("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-500">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                  {...registerPassword("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === newPassword || "Passwords do not match",
                  })}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
