import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BetHistory from "./pages/BetHistory";
import ParlayAI from "./pages/ParlayAI";
import { BetSlipProvider } from "./contexts/BetSlipContext";
import { WalletProvider } from "./contexts/WalletContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/history" component={BetHistory} />
      <Route path="/parlay" component={ParlayAI} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <WalletProvider>
          <BetSlipProvider>
            <TooltipProvider>
              <Toaster position="top-right" theme="dark" />
              <Router />
            </TooltipProvider>
          </BetSlipProvider>
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
