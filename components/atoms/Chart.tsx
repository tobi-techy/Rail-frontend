import { View } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';

interface ChartProps {
  data: { value: number }[];
  height?: number;
  width: number;
  color?: string;
  startFillColor?: string;
  endFillColor?: string;
  type?: 'line' | 'area';
}

export function Chart({
  data,
  height = 100,
  width,
  color = '#84CC16',
  startFillColor = '#84CC16',
  endFillColor = '#FFFFFF',
  type = 'area',
}: ChartProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (!data.length || width <= 0) return { linePath: null, areaPath: null };

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const padding = 2;
    const chartHeight = height - padding * 2;
    const stepX = data.length > 1 ? width / (data.length - 1) : 0;

    const points = values.map((val, i) => ({
      x: i * stepX,
      y: padding + chartHeight - ((val - minVal) / range) * chartHeight,
    }));

    if (points.length === 0) return { linePath: null, areaPath: null };

    const line = Skia.Path.Make();
    line.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      line.cubicTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
    }

    const area = line.copy();
    area.lineTo(width, height);
    area.lineTo(0, height);
    area.close();

    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  if (!linePath || !areaPath) return <View style={{ width, height }} />;

  return (
    <Canvas style={{ width, height }}>
      <Path path={areaPath}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[startFillColor + '40', endFillColor + '00']}
        />
      </Path>
      <Path
        path={linePath}
        style="stroke"
        strokeWidth={2}
        color={color}
        strokeCap="round"
        strokeJoin="round"
      />
    </Canvas>
  );
}
