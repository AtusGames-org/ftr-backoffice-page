import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { getMetricsSummary, MetricsSummary } from '../services/metricsService';

function Dashboard() {
    const [summary, setSummary] = useState<MetricsSummary | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            const data = await getMetricsSummary();
            setSummary(data);
        };

        loadSummary();
    }, []);

    return (
        <div className="space-y-6">
            <section className="app-card p-6">
                <h2 className="app-title text-2xl">Realm Overview</h2>
                <p className="text-sm text-[rgba(184,176,214,0.8)]">
                    Core performance signals, refreshed every five minutes.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Players" value={summary ? summary.totalPlayers.toLocaleString() : '--'} caption="All-time registered" />
                    <StatCard title="Active Players" value={summary ? summary.activePlayers.toLocaleString() : '--'} caption="Currently in world" />
                    <StatCard
                        title="Avg Player Time"
                        value={summary?.avgPlayerTime ? `${summary.avgPlayerTime} hrs` : '--'}
                        caption="Per weekly session"
                    />
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <StatCard
                    title="Worlds Online"
                    value={summary ? `${summary.worldsOnline}/${summary.totalWorlds}` : '--'}
                    caption="Online vs total worlds"
                />
                <StatCard
                    title="Zones Online"
                    value={summary ? `${summary.onlineZones}/${summary.totalZones}` : '--'}
                    caption={`Avg ${summary ? summary.avgZonesPerWorld : '--'} zones per world`}
                />
                <StatCard
                    title="Gems Flow"
                    value={
                        summary?.gemsBought && summary?.gemsSpent
                            ? `${summary.gemsBought.toLocaleString()} / ${summary.gemsSpent.toLocaleString()}`
                            : '--'
                    }
                    caption="Bought vs spent"
                />
            </section>

            <section className="app-card p-6">
                <h3 className="app-title text-xl">Cosmetics Economy</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <StatCard
                        title="Total Cosmetics"
                        value={summary?.totalCosmetics ? summary.totalCosmetics.toLocaleString() : '--'}
                        caption="Across all realms"
                    />
                    <StatCard
                        title="Average Price"
                        value={summary?.avgCosmeticPrice ? `${summary.avgCosmeticPrice} gems` : '--'}
                        caption="Weighted market rate"
                    />
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <StatCard
                    title="Creator Balance"
                    value={summary ? `$${summary.totalCreatorBalance.toFixed(2)}` : '--'}
                    caption="Total earnings pooled"
                />
                <StatCard
                    title="Gems In Circulation"
                    value={summary ? summary.totalGemsInCirculation.toLocaleString() : '--'}
                    caption="All player balances"
                />
            </section>
        </div>
    );
}

export default Dashboard;
