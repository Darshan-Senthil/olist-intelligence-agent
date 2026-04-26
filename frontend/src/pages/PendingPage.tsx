import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Background } from "@/components/Background";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function PendingPage() {
  const reduce = useReducedMotion();
  const { user, logout } = useAuth();

  return (
    <motion.div
      className="relative min-h-[calc(100vh-4rem)]"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Background />
      <div className="relative z-10 mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Card className="border-border bg-card/95 shadow-sm ring-1 ring-border/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl font-medium">
              Account pending approval
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {user?.email ? (
                <>
                  Signed in as <span className="font-medium text-foreground">{user.email}</span>.
                  An administrator must activate your account before you can run live
                  queries on the Analyze workspace.
                </>
              ) : (
                "You are signed in, but this account is not active yet."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="outline" onClick={() => logout()}>
              Sign out
            </Button>
            <Button asChild variant="secondary">
              <Link to="/demo">Try the demo</Link>
            </Button>
            <Button asChild>
              <Link to="/">Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
