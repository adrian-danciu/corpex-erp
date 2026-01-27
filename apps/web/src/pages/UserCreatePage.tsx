import UserCreateForm from "../components/users/UserCreateForm";

export default function UserCreatePage() {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">IT Department</h1>
        <p className="text-slate-600">User Management System</p>
      </div>

      {/* Form */}
      <UserCreateForm />
    </div>
  );
}
