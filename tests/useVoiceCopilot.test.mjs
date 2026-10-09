import test from 'node:test';
import assert from 'node:assert/strict';

// Setup browser globals before importing the hook
class MockMediaStreamTrack {
  constructor() {
    this.stopped = false;
  }
  stop() {
    this.stopped = true;
  }
}

class MockMediaStream {
  constructor() {
    this.tracks = [new MockMediaStreamTrack()];
  }
  getTracks() {
    return this.tracks;
  }
}

class MockMediaRecorder {
  static isTypeSupported(type) {
    return type === 'audio/webm;codecs=opus';
  }

  constructor(stream, options = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType || 'audio/webm;codecs=opus';
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    MockMediaRecorder.instances.push(this);
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['fake audio chunk'], { type: this.mimeType }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  }
}
MockMediaRecorder.instances = [];

globalThis.MockMediaRecorder = MockMediaRecorder;
globalThis.MediaRecorder = MockMediaRecorder;

let mockStream = new MockMediaStream();
const mockGetUserMediaCalls = [];
let mockGetUserMediaShouldFail = false;

const mockMediaDevices = {
  getUserMedia: async (constraints) => {
    if (mockGetUserMediaShouldFail) {
      throw new Error('Permission denied');
    }
    mockGetUserMediaCalls.push(constraints);
    return mockStream;
  },
};

try {
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: mockMediaDevices,
    configurable: true,
    writable: true,
  });
} catch {
  Object.defineProperty(globalThis, 'navigator', {
    value: { mediaDevices: mockMediaDevices },
    configurable: true,
    writable: true,
  });
}

// Mock window timers
const activeIntervals = new Map();
const activeTimeouts = new Map();
let nextId = 1;

globalThis.window = {
  setInterval: (fn, ms) => {
    const id = nextId++;
    activeIntervals.set(id, { fn, ms });
    return id;
  },
  clearInterval: (id) => {
    activeIntervals.delete(id);
  },
  setTimeout: (fn, ms) => {
    const id = nextId++;
    activeTimeouts.set(id, { fn, ms });
    return id;
  },
  clearTimeout: (id) => {
    activeTimeouts.delete(id);
  },
};

// Import React and Hook
import React from 'react';
const { useVoiceCopilot } = await import('../src/hooks/useVoiceCopilot.ts');

function createHookRunner(hook) {
  let stateSlots = [];
  let stateIndex = 0;
  let refSlots = [];
  let refIndex = 0;
  let effectCleanups = [];

  const ReactDispatcher = {
    useState: (initial) => {
      const idx = stateIndex++;
      if (stateSlots.length <= idx) {
        stateSlots.push(typeof initial === 'function' ? initial() : initial);
      }
      const setState = (newVal) => {
        stateSlots[idx] = typeof newVal === 'function' ? newVal(stateSlots[idx]) : newVal;
      };
      return [stateSlots[idx], setState];
    },
    useRef: (initial) => {
      const idx = refIndex++;
      if (refSlots.length <= idx) {
        refSlots.push({ current: initial });
      }
      return refSlots[idx];
    },
    useCallback: (fn) => fn,
    useEffect: (effect) => {
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        effectCleanups.push(cleanup);
      }
    },
  };

  function render() {
    stateIndex = 0;
    refIndex = 0;
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = ReactDispatcher;
    const result = hook();
    React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = null;
    return result;
  }

  function unmount() {
    effectCleanups.forEach((cleanup) => cleanup());
  }

  return { render, unmount };
}

test('useVoiceCopilot initializes with correct default state', () => {
  const runner = createHookRunner(useVoiceCopilot);
  const result = runner.render();

  assert.equal(result.isRecording, false);
  assert.equal(result.audioBlob, null);
  assert.equal(result.duration, 0);
  assert.equal(typeof result.startRecording, 'function');
  assert.equal(typeof result.stopRecording, 'function');
});

test('useVoiceCopilot starts recording and configures MediaRecorder with opus format', async () => {
  MockMediaRecorder.instances = [];
  mockGetUserMediaCalls.length = 0;
  mockGetUserMediaShouldFail = false;
  mockStream = new MockMediaStream();
  activeIntervals.clear();
  activeTimeouts.clear();
  const runner = createHookRunner(useVoiceCopilot);
  let hookState = runner.render();

  await hookState.startRecording();
  hookState = runner.render();

  assert.equal(hookState.isRecording, true);
  assert.equal(mockGetUserMediaCalls.length, 1);
  assert.deepEqual(mockGetUserMediaCalls[0], { audio: true });

  assert.equal(MockMediaRecorder.instances.length, 1);
  const recorder = MockMediaRecorder.instances[0];
  assert.equal(recorder.mimeType, 'audio/webm;codecs=opus');
  assert.equal(recorder.state, 'recording');

  // Verify 10 min auto-stop timer was registered (600,000 ms)
  const timeout10m = Array.from(activeTimeouts.values()).find((t) => t.ms === 600000);
  assert.ok(timeout10m, '10-minute timeout (600.000 ms) must be scheduled');

  // Verify 1 second duration interval was registered
  const interval1s = Array.from(activeIntervals.values()).find((i) => i.ms === 1000);
  assert.ok(interval1s, '1-second duration interval must be scheduled');
});

test('useVoiceCopilot stopRecording stops recorder, creates opus audioBlob, and stops media tracks', async () => {
  MockMediaRecorder.instances = [];
  mockGetUserMediaShouldFail = false;
  mockStream = new MockMediaStream();
  activeIntervals.clear();
  activeTimeouts.clear();
  const runner = createHookRunner(useVoiceCopilot);
  let hookState = runner.render();

  await hookState.startRecording();
  hookState = runner.render();

  const recorder = MockMediaRecorder.instances[0];
  assert.equal(recorder.state, 'recording');

  // Stop recording
  hookState.stopRecording();
  hookState = runner.render();

  assert.equal(hookState.isRecording, false);
  assert.ok(hookState.audioBlob instanceof Blob, 'audioBlob should be an instance of Blob');
  assert.equal(hookState.audioBlob.type, 'audio/webm;codecs=opus');
  assert.equal(mockStream.tracks[0].stopped, true, 'Media stream tracks must be stopped');
  assert.equal(activeTimeouts.size, 0, 'Timeout must be cleared');
  assert.equal(activeIntervals.size, 0, 'Interval must be cleared');
});

test('useVoiceCopilot increments duration on interval ticks', async () => {
  MockMediaRecorder.instances = [];
  mockGetUserMediaShouldFail = false;
  mockStream = new MockMediaStream();
  activeIntervals.clear();
  activeTimeouts.clear();
  const runner = createHookRunner(useVoiceCopilot);
  let hookState = runner.render();

  await hookState.startRecording();
  hookState = runner.render();

  const intervalEntry = Array.from(activeIntervals.values()).find((i) => i.ms === 1000);
  assert.ok(intervalEntry, 'Interval exists');

  intervalEntry.fn();
  hookState = runner.render();
  assert.equal(hookState.duration, 1);

  intervalEntry.fn();
  hookState = runner.render();
  assert.equal(hookState.duration, 2);
});

test('useVoiceCopilot auto-stops when 10 minutes timeout fires', async () => {
  MockMediaRecorder.instances = [];
  mockGetUserMediaShouldFail = false;
  mockStream = new MockMediaStream();
  activeIntervals.clear();
  activeTimeouts.clear();
  const runner = createHookRunner(useVoiceCopilot);
  let hookState = runner.render();

  await hookState.startRecording();
  hookState = runner.render();

  const recorder = MockMediaRecorder.instances[0];
  assert.equal(recorder.state, 'recording');

  // Find 10-minute timeout
  const timeoutEntry = Array.from(activeTimeouts.entries()).find(([, t]) => t.ms === 600000);
  assert.ok(timeoutEntry, 'Timeout exists');
  const [, timeoutObj] = timeoutEntry;

  // Trigger timeout
  timeoutObj.fn();
  hookState = runner.render();

  assert.equal(recorder.state, 'inactive');
  assert.equal(hookState.isRecording, false);
  assert.ok(hookState.audioBlob !== null);
});

test('useVoiceCopilot handles getUserMedia errors gracefully', async () => {
  MockMediaRecorder.instances = [];
  mockGetUserMediaShouldFail = true;
  activeIntervals.clear();
  activeTimeouts.clear();
  const runner = createHookRunner(useVoiceCopilot);
  let hookState = runner.render();

  await hookState.startRecording();
  hookState = runner.render();

  assert.equal(hookState.isRecording, false);
  assert.equal(hookState.audioBlob, null);
  assert.equal(activeIntervals.size, 0);
  assert.equal(activeTimeouts.size, 0);
});

test('useVoiceCopilot cleans up stream and timers on unmount', async () => {
  MockMediaRecorder.instances = [];
  mockGetUserMediaShouldFail = false;
  mockStream = new MockMediaStream();
  activeIntervals.clear();
  activeTimeouts.clear();
  const runner = createHookRunner(useVoiceCopilot);
  let hookState = runner.render();

  await hookState.startRecording();
  hookState = runner.render();

  assert.equal(activeIntervals.size, 1);
  assert.equal(activeTimeouts.size, 1);

  runner.unmount();

  assert.equal(mockStream.tracks[0].stopped, true, 'Stream tracks must be stopped on unmount');
  assert.equal(activeIntervals.size, 0, 'Intervals must be cleared on unmount');
  assert.equal(activeTimeouts.size, 0, 'Timeouts must be cleared on unmount');
});
