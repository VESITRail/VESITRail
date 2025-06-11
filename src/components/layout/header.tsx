"use client";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/app/icon.svg";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Large } from "@/components/ui/typography";
import { navigationItems } from "@/config/navigation";
import PWAInstallButton from "@/components/utils/pwa-install-button";

const Header = () => {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6 md:px-16 xl:px-8">
          <Link href="/" className="flex gap-2.5 items-center">
            <Image src={Logo} alt="Logo" className="size-8.25 rounded-lg" />
            <Large className="font-bold">VESITRail</Large>
          </Link>

          <NavigationMenu className="flex-1 justify-center hidden lg:flex">
            <NavigationMenuList className="space-x-1">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link
                    href={item.href}
                    className="px-5 py-2.5 text-base font-medium transition-colors hover:text-foreground hover:border-b-[1.75px] hover:border-foreground"
                  >
                    {item.label}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex gap-4 items-center">
            <PWAInstallButton />

            <Button
              size="icon"
              variant="outline"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="fixed lg:hidden bottom-0 left-0 z-50 w-full h-24 border-t-2 bg-background">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="inline-flex flex-col items-center justify-center px-5 gap-2 transition-colors 
                   hover:bg-primary hover:text-primary-foreground
                   active:bg-primary active:text-primary-foreground
                   focus:bg-primary focus:text-primary-foreground"
            >
              <span className="w-5 h-5">{<item.icon />}</span>
              <span className="text-sm ml-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Header;
