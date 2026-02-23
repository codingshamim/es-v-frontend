import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import { NavButton } from "./NavButton";
import { LogInIcon, UserPlusIcon } from "@/components/icons";

export function NavButtons() {
  return (
    <nav className="flex items-center gap-3" aria-label="Main navigation">
      <DarkModeToggle />
      <NavButton
        href="/login"
        icon={<LogInIcon className="w-4.5 h-4.5" />}
        ariaLabel="Login"
      >
        লগিন
      </NavButton>
      <NavButton
        href="/register"
        variant="filled"
        icon={<UserPlusIcon className="w-4.5 h-4.5" />}
        ariaLabel="Register"
      >
        <span className="hidden sm:inline font-bengali">রেজিস্টার</span>
      </NavButton>
    </nav>
  );
}
