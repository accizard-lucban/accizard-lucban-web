import { ResponsiveLine } from '@nivo/line';

interface ReportsOverTimeChartProps {
  data: any[];
  enabledReportTypes: Record<string, boolean>;
  hazardColors: Record<string, string>;
  nivoTheme: any;
  height?: string;
  chartId?: string;
  pointSize?: number;
  bottomMargin?: number;
}

export function ReportsOverTimeChart({
  data,
  enabledReportTypes,
  hazardColors,
  nivoTheme,
  height = '100%',
  chartId = 'reports-over-time-chart',
  pointSize = 6,
  bottomMargin = 60
}: ReportsOverTimeChartProps) {
  return (
    <div id={chartId} style={{ height, minHeight: '300px' }}>
      <ResponsiveLine
        data={data.filter(item => enabledReportTypes[item.id])}
        margin={{ top: 30, right: 60, bottom: bottomMargin, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{ 
          type: 'linear', 
          min: 'auto', 
          max: 'auto',
          stacked: false,
          reverse: false 
        }}
        yFormat=" >-.0f"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Month',
          legendPosition: 'middle',
          legendOffset: bottomMargin > 60 ? 50 : 40
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Number of Reports',
          legendPosition: 'middle',
          legendOffset: -50
        }}
        colors={({ id }) => hazardColors[id as keyof typeof hazardColors] || '#6B7280'}
        pointSize={pointSize}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'seriesColor' }}
        pointLabelYOffset={-12}
        useMesh={true}
        theme={nivoTheme}
        tooltip={({ point }) => (
          <div style={{
            background: 'white',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 600, color: '#111827' }}>
              {point.data.xFormatted}
            </div>
            <div style={{ color: point.seriesColor, fontWeight: 500 }}>
              {point.seriesId}: {point.data.yFormatted} reports
            </div>
          </div>
        )}
      />
    </div>
  );
}

