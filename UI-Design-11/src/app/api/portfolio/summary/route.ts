import { computePortfolio, buildPortfolioHistory } from "@/lib/portfolio";
import { cagr, maxDrawdown, toReturns, volatility, sharpe, betaAlpha } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const [summary, history] = await Promise.all([computePortfolio(), buildPortfolioHistory()]);
  const returns = toReturns(history.total.map((p) => ({ ...p })));
  const benchReturns = toReturns(history.benchmark);
  const { beta, alpha } = betaAlpha(returns, benchReturns);
  return Response.json({
    summary,
    metrics: {
      cagr: cagr(history.total),
      volatility: volatility(returns),
      sharpe: sharpe(returns),
      maxDrawdown: maxDrawdown(history.total),
      beta,
      alpha,
      points: history.total.length,
    },
  });
}
