interface StatCardProps {
    title: string;
    value: string;
    caption?: string;
}

function StatCard({ title, value, caption }: StatCardProps) {
    return (
        <div className="app-card flex flex-col gap-2 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6ae4ff]">{title}</p>
            <p className="text-3xl font-semibold text-[#f8f5ff]">{value}</p>
            {caption && <p className="text-sm text-[rgba(184,176,214,0.8)]">{caption}</p>}
        </div>
    );
}

export default StatCard;
