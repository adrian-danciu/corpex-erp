import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Corporate branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12">
        <div className="text-white text-center">
          <h1 className="text-5xl font-bold mb-4">Corpex ERP</h1>
          <p className="text-xl text-blue-100">
            Enterprise Resource Planning System
          </p>
        </div>
      </div>

      {/* Right side - Login form (full width on mobile) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
