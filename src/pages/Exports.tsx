import ExportsPanel from '../components/ExportsPanel';

function Exports() {
    return (
        <div className="space-y-6">
            <section className="app-card p-6">
                <h2 className="app-title text-2xl">Exports</h2>
                <p className="mt-2 text-sm text-[rgba(184,176,214,0.8)]">
                    Upload build artifacts, manage versions, and promote the latest release.
                </p>
            </section>

            <ExportsPanel />
        </div>
    );
}

export default Exports;