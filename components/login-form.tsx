"use client";
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/utils/firebaseConfig"

export function LoginForm() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };
  return (
    // <Card className="mx-auto max-w-sm">
    //   <CardHeader>
    //     <CardTitle className="text-2xl">Login</CardTitle>
    //     <CardDescription>
    //       Enter your email below to login to your account
    //     </CardDescription>
    //   </CardHeader>
    //   <CardContent>
    //     <div className="grid gap-4">
    //       <div className="grid gap-2">
    //         <Label htmlFor="email">Email</Label>
    //         <Input
    //           id="email"
    //           type="email"
    //           placeholder="m@example.com"
    //           required
    //         />
    //       </div>
    //       <div className="grid gap-2">
    //         <div className="flex items-center">
    //           <Label htmlFor="password">Password</Label>
    //           <Link href="#" className="ml-auto inline-block text-sm underline">
    //             Forgot your password?
    //           </Link>
    //         </div>
    //         <Input id="password" type="password" required />
    //       </div>
    //       <Button type="submit" className="w-full">
    //         Login
    //       </Button>
    //       <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
    //         Login with Google
    //       </Button>
    //     </div>
    //     <div className="mt-4 text-center text-sm">
    //       Don&apos;t have an account?{" "}
    //       <Link href="#" className="underline">
    //         Sign up
    //       </Link>
    //     </div>
    //   </CardContent>
    // </Card>

    <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
    Login with Google
    </Button>
  )
}
