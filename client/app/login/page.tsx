"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AlertCircle } from "lucide-react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { BrandMark } from "@/components/layout/app-shell";
import { api, getGithubLoginUrl, type User } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser, setAuthCookie } from "@/hooks/use-auth";

function LoginLoading(){
    return(
        <div className="flex min-h-svh w-full items-center justify-center">
            <Spinner className="size-8"/>
        </div>
    )
}

const LoginContent = () => {
    const params = useSearchParams();
    const router = useRouter();
    const error = params.get("error");
    const next = params.get("next") || "/dashboard";
    const [user, setUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    useEffect(() => {
        let isActive = true;

        void api
            .session()
            .then((currentUser) => {
                if (!isActive) {
                    return;
                }

                setUser(currentUser);
                if (currentUser) {
                    // ensure the frontend auth cookie matches the backend session
                    setAuthCookie(true);
                }
                setIsLoading(false);
            })
            .catch(() => {
                if (!isActive) {
                    return;
                }

                setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        router.replace(next);
    }, [next, router, user]);

    if (isLoading || user) {
        return <LoginLoading/>
    }


  return (
        <div className="relative flex min-h-svh w-full flex-col overflow-hidden bg-background">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 top-[15%] size-80 rounded-full bg-primary/20 blur-3xl sm:left-[15%] sm:size-[28rem] dark:bg-primary/15" />
                <div className="absolute -right-24 bottom-[10%] size-80 rounded-full bg-violet-400/20 blur-3xl sm:right-[10%] sm:size-[30rem] dark:bg-violet-500/15" />
                <div className="absolute left-1/2 top-[10%] size-64 -translate-x-1/2 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />
                <div className="absolute -inset-6 bg-[url('/coding-background.svg')] bg-cover bg-center bg-no-repeat opacity-25 blur-[3px] sm:blur-[5px] dark:opacity-40" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_90%)]" />
            </div>

            <header className="relative z-10 flex h-14 items-center justify-between px-4">
                <BrandMark />
                <ModeToggle />
            </header>

            <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
                <Card className="w-full max-w-sm border-border/70 bg-card/90 shadow-lg shadow-foreground/5 backdrop-blur">
                    <CardHeader className="space-y-4 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
                            <GitHubIcon className="size-6" />
                        </div>

                        <div className="space-y-1">
                            <CardTitle className="text-xl">Sign in</CardTitle>
                            <CardDescription>
                                Connect GitHub to chat with your repositories.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {error ? (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Could not sign in</AlertTitle>
                                <AlertDescription>
                                    Authentication failed. Please try again.
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        <a
                            href={getGithubLoginUrl()}
                            className={cn(
                                buttonVariants({ size: "lg" }),
                                "inline-flex w-full items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90"
                            )}
                        >
                            <GitHubIcon className="size-5" />
                            Continue with GitHub
                        </a>
                    </CardContent>
                </Card>
            </main>
        </div>
  );
};

export default function LoginPage(){
    return(
        <Suspense fallback={<LoginLoading/>}>
            <LoginContent/>
        </Suspense>
    )
}
