import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sequencerPanelImportSchemaV1 } from './panel/sequencer-panel-import.schema';
import { analysisTimelineImportSchemaV1 } from './timeline/analysis-timeline-import.schema';

function readExampleJson<T>(fileName: string): T {
  const filePath = join(process.cwd(), 'postman', 'examples', fileName);
  const content = readFileSync(filePath, 'utf-8');

  return JSON.parse(content) as T;
}

describe('backend v1 JSON examples', () => {
  it('validates sequencer-panel.valid.v1.json with backend schema', () => {
    const payload = readExampleJson<unknown>('sequencer-panel.valid.v1.json');
    const result = sequencerPanelImportSchemaV1.safeParse(payload);

    expect(result.success).toBe(true);
  });

  it('validates analysis-timeline.valid.v1.json with backend schema', () => {
    const payload = readExampleJson<unknown>('analysis-timeline.valid.v1.json');
    const result = analysisTimelineImportSchemaV1.safeParse(payload);

    expect(result.success).toBe(true);
  });
});
