import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Corporate branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12">
        <div className="text-white text-center">
          <img
            src="/corpex_complete_logo_white.png"
            alt="Corpex ERP"
            className="mx-auto mb-4 h-24 w-auto"
          />
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
