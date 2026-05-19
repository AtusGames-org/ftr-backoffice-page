import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { getMetricsSummary, MetricsSummary } from '../services/metricsService';

function Dashboard() {
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            const data = await getMetricsSummary();
            setSummary(data);
            setLastSync(new Date());
        };

        loadSummary();
        const interval = setInterval(loadSummary, 5 * 60 * 1000); // Refresh every 5 minutes
        return () => clearInterval(interval);
    }, []);

    const getLastSyncText = () => {
        if (!lastSync) return 'Never';
        const seconds = Math.floor((Date.now() - lastSync.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        return `${Math.floor(seconds / 3600)} hr ago`;
    };

    return (
        <div className="space-y-6">
            <section className="app-card p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="app-title text-2xl">Realm Overview</h2>
                        <p className="text-sm text-[rgba(184,176,214,0.8)]">
                            Core performance signals, refreshed every five minutes.
                        </p>
                    </div>
                    <p className="text-xs text-[rgba(184,176,214,0.8)]">Last sync: {getLastSyncText()}</p>
                </div>
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
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Default Cosmetics"
                        value={summary ? summary.defaultCosmetics.toLocaleString() : '--'}
                        caption="World-independent cosmetics"
                    />
                    <StatCard
                        title="User Cosmetics"
                        value={summary ? summary.userCreatedCosmetics.toLocaleString() : '--'}
                        caption="Created for specific worlds"
                    />
                    <StatCard
                        title="Average Price"
                        value={summary ? `${summary.avgCosmeticPrice} gems` : '--'}
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
