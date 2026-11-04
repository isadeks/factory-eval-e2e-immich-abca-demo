import { ServerService } from 'src/services/server.service';
import { newTestService } from 'test/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe(`${ServerService.name} uptime`, () => {
  let sut: ServerService;

  beforeEach(() => {
    ({ sut } = newTestService(ServerService));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the process uptime in whole seconds', () => {
    vi.spyOn(process, 'uptime').mockReturnValue(125.9);

    expect(sut.getUptime()).toEqual({ uptimeSeconds: 125 });
  });
});
