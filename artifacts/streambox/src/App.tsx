import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';

// Pages
import { Home } from '@/pages/home';
import { AnimeBrowse } from '@/pages/anime-browse';
import { MoviesBrowse } from '@/pages/movies-browse';
import { AnimeDetail } from '@/pages/anime-detail';
import { MovieDetail } from '@/pages/movie-detail';
import { WatchPlayer } from '@/pages/watch';
import { Watchlist } from '@/pages/watchlist';
import { Search } from '@/pages/search';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/watch/anime" component={WatchPlayer} />
      <Route path="/watch/movie" component={WatchPlayer} />
      
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/anime" component={AnimeBrowse} />
            <Route path="/movies" component={MoviesBrowse} />
            <Route path="/anime/:id" component={AnimeDetail} />
            <Route path="/movies/:id" component={MovieDetail} />
            <Route path="/watchlist" component={Watchlist} />
            <Route path="/search" component={Search} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
