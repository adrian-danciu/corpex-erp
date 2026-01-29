import { useState } from "react";
import type { User as UserType } from "@/types/auth.types";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@apollo/client/react";
import { CHANGE_PASSWORD_MUTATION, UPDATE_PROFILE_PICTURE_MUTATION } from "@/graphql/mutations/profile.mutations";
import { User, Camera } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Profile picture state
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePicture || "");
  const [pictureError, setPictureError] = useState("");
  const [pictureSuccess, setPictureSuccess] = useState(false);

  // Mutations
  const [changePasswordMutation, { loading: changingPassword }] = useMutation(
    CHANGE_PASSWORD_MUTATION,
    {
      onCompleted: () => {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 5000);
      },
      onError: (error) => {
        setPasswordErrors({
          ...passwordErrors,
          currentPassword: error.message,
        });
      },
    }
  );

  const [updateProfilePictureMutation, { loading: updatingPicture }] = useMutation<{
    updateProfilePicture: UserType;
  }>(
    UPDATE_PROFILE_PICTURE_MUTATION,
    {
      onCompleted: (data) => {
        updateUser(data.updateProfilePicture);
        setPictureSuccess(true);
        setTimeout(() => setPictureSuccess(false), 5000);
      },
      onError: (error) => {
        setPictureError(error.message);
      },
    }
  );

  // Password validation
  const validatePasswordForm = () => {
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
      isValid = false;
    }

    if (!newPassword) {
      errors.newPassword = "New password is required";
      isValid = false;
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);

    if (!validatePasswordForm()) {
      return;
    }

    try {
      await changePasswordMutation({
        variables: {
          changePasswordInput: {
            currentPassword,
            newPassword,
          },
        },
      });
    } catch (error) {
      console.error("Password change error:", error);
    }
  };

  // Handle profile picture update
  const handleProfilePictureUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPictureError("");
    setPictureSuccess(false);

    // Validate URL format (basic validation)
    if (profilePictureUrl && !profilePictureUrl.match(/^https?:\/\/.+/)) {
      setPictureError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    try {
      await updateProfilePictureMutation({
        variables: {
          updateProfilePictureInput: {
            profilePicture: profilePictureUrl || null,
          },
        },
      });
    } catch (error) {
      console.error("Profile picture update error:", error);
    }
  };

  // Handle remove profile picture
  const handleRemoveProfilePicture = async () => {
    setProfilePictureUrl("");
    setPictureError("");
    setPictureSuccess(false);

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
                  {pictureError}
                </div>
              )}
            </div>

            <form onSubmit={handleProfilePictureUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profilePicture">Profile Picture URL</Label>
                <Input
                  id="profilePicture"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
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

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={passwordErrors.currentPassword ? "border-red-500" : ""}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={passwordErrors.newPassword ? "border-red-500" : ""}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-500">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {passwordErrors.confirmPassword}
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
