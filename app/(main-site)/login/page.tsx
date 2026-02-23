import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Login",
  description: "Login to ES FITT – access your account and exclusive offers.",
};

export default function LoginPage() {
  return (
    <>
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 bg-black dark:bg-black">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>
    </>
  );
}
