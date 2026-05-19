import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { getMetricsSummary, MetricsSummary } from '../services/metricsService';

function Metrics() {
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
                <h2 className="app-title text-2xl">Player Metrics</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Players" value={summary ? summary.totalPlayers.toLocaleString() : '--'} />
                    <StatCard title="Active Players" value={summary ? summary.activePlayers.toLocaleString() : '--'} />
                    <StatCard
                        title="Avg Player Time"
                        value={summary ? (summary.avgPlayerTime !== null ? `${summary.avgPlayerTime} hrs` : '--') : '--'}
                    />
                </div>
            </section>

            <section className="app-card p-6">
                <h2 className="app-title text-2xl">World Metrics</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <StatCard title="Total Worlds" value={summary ? summary.totalWorlds.toLocaleString() : '--'} />
                    <StatCard title="Total Zones" value={summary ? summary.totalZones.toLocaleString() : '--'} />
                    <StatCard title="Online Zones" value={summary ? summary.onlineZones.toLocaleString() : '--'} />
                    <StatCard title="Avg Zones / World" value={summary ? summary.avgZonesPerWorld.toLocaleString() : '--'} />
                </div>
            </section>

            <section className="app-card p-6">
                <h2 className="app-title text-2xl">Economy Metrics</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Gems Bought"
                        value={summary ? (summary.gemsBought !== null ? summary.gemsBought.toLocaleString() : '--') : '--'}
                    />
                    <StatCard
                        title="Gems Spent"
                        value={summary ? (summary.gemsSpent !== null ? summary.gemsSpent.toLocaleString() : '--') : '--'}
                    />
                    <StatCard
                        title="Cosmetics"
                        value={summary ? `${summary.userCreatedCosmetics.toLocaleString()} items` : '--'}
                        caption={summary ? `Avg price ${summary.avgCosmeticPrice} gems` : undefined}
                    />
                </div>
            </section>

            <section className="app-card p-6">
                <h2 className="app-title text-2xl">Creator Economy</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <StatCard
                        title="Total Creator Balance"
                        value={summary ? `$${summary.totalCreatorBalance.toFixed(2)}` : '--'}
                    />
                    <StatCard
                        title="Gems In Circulation"
                        value={summary ? summary.totalGemsInCirculation.toLocaleString() : '--'}
                    />
                </div>
            </section>
        </div>
    );
}

export default Metrics;
