import Panel from '../common/Panel';
import Badge from '../common/Badge';
import "../../../dashboard/Stylesheet/ictp.css";
import { LoadingState, EmptyState, ErrorState } from '../common/AsyncStates';

// `error` here means "the most recent poll failed" -- it does NOT mean
// there's nothing to show. useApiResource deliberately never clears `data`
// just because a poll failed (e.g. the network dropped), so as long as we
// already have data (`!empty`), we keep rendering it. A failed poll only
// blocks the chart when we have never successfully loaded anything yet.
// This is what keeps SNR/multipath/etc panels on screen instead of
// flashing an error and disappearing the moment the connection drops.
export default function ChartCard({ title, subtitle, actions, loading, empty, emptyDetail, error, children, height = 160 }) {
  const showingStaleData = error && !empty;
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      actions={
        <>
          {showingStaleData && (
            <Badge tone="warning" title={error.message}>
              Offline · last known data
            </Badge>
          )}
          {actions}
        </>
      }
      bodyClassName="p-3"
    >
      <div style={{ height }}>
        {loading && empty && <LoadingState />}
        {!loading && empty && error && <ErrorState detail={error.message} />}
        {!loading && empty && !error && <EmptyState title="No data" detail={emptyDetail} />}
        {!empty && children}
      </div>
    </Panel>
  );
}
