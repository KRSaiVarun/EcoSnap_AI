import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ChatPage from "@/pages/chat";
import HistoryPage from "@/pages/history";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import ProfilePage from "@/pages/profile";
import RegisterPage from "@/pages/register";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";

function Router() {
  const [location] = useLocation();
  const isAuthPage =
    location === "/login" ||
    location === "/register" ||
    location === "/profile";
  const token = localStorage.getItem("authToken");

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route
        path="/profile"
        component={() => {
          if (!token) {
            window.location.href = "/login";
            return null;
          }
          return <ProfilePage />;
        }}
      />
      <Route path="/chat" component={ChatPage} />
      <Route path="/" component={HomePage} />
      <Route path="/history" component={HistoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
