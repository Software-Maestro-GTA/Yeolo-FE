/**
 * @file TasteAnalysisScreen.test.tsx
 * @description Integration and unit tests for TasteAnalysisScreen onboarding photo scanning and preference streaming.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-2
 * @author Antigravity Agent
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { TasteAnalysisScreen } from '../src/screens/TasteAnalysisScreen';
import { ANALYSIS_PHOTO_LIMIT } from '../src/constants/config';
import { Query, AssetField, MediaType } from 'expo-media-library';
import { analyzeTastePreferenceStream, useTasteStore } from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Mock expo-media-library utilizing Query builder patterns
const mockLocation = { latitude: 37.5665, longitude: 126.9780 };
const mockAsset1 = {
  id: 'asset_001',
  getLocation: jest.fn().mockResolvedValue(mockLocation),
  getCreationTime: jest.fn().mockResolvedValue(1716000000000),
};
const mockAsset2 = {
  id: 'asset_002',
  getLocation: jest.fn().mockResolvedValue(null), // Missing location details (should be filtered out)
  getCreationTime: jest.fn().mockResolvedValue(1716000000000),
};

const mockExe = jest.fn();
const mockOrderBy = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();

jest.mock('expo-media-library', () => {
  class MockQuery {
    eq = mockEq;
    orderBy = mockOrderBy;
    limit = mockLimit;
    exe = mockExe;
  }
  return {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    Query: MockQuery,
    AssetField: {
      CREATION_TIME: 'creationTime',
      MEDIA_TYPE: 'mediaType',
    },
    MediaType: {
      IMAGE: 'image',
    },
  };
});

// 2. Mock @yeolo/common APIs
jest.mock('@yeolo/common', () => {
  const actual = jest.requireActual('@yeolo/common');
  return {
    ...actual,
    analyzeTastePreferenceStream: jest.fn().mockResolvedValue('test-taste-profile-id-1234'),
  };
});

// 3. Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('fake-access-token'),
}));

describe('TasteAnalysisScreen Integration Tests', () => {
  const mockOnFinish = jest.fn();
  const mockOnFail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockExe.mockResolvedValue([mockAsset1, mockAsset2]);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('최신 사진을 먼저 가져오도록 내림차순(ascending: false)으로 Query를 빌딩하고 호출해야 한다', async () => {
    render(<TasteAnalysisScreen onFinish={mockOnFinish} onFail={mockOnFail} />);

    await waitFor(() => {
      // Asserts that Query builders are chain-called with descending order
      expect(mockEq).toHaveBeenCalledWith('mediaType', 'image');
      expect(mockOrderBy).toHaveBeenCalledWith({ key: 'creationTime', ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(ANALYSIS_PHOTO_LIMIT);
      expect(mockExe).toHaveBeenCalled();
    });
  });

  it('서버로 전달하는 timezone은 모두 UTC로 고정하고, GPS가 유실된 사진은 필터링해야 한다', async () => {
    render(<TasteAnalysisScreen onFinish={mockOnFinish} onFail={mockOnFail} />);

    await waitFor(() => {
      expect(analyzeTastePreferenceStream).toHaveBeenCalled();
    });

    const [, , payload] = (analyzeTastePreferenceStream as jest.Mock).mock.calls[0];

    // mockAsset2 (location: null) must be filtered out, only mockAsset1 is submitted
    expect(payload.images).toHaveLength(1);
    expect(payload.images[0]).toEqual({
      sourceImageId: 'asset_001',
      capturedAt: new Date(1716000000000).toISOString(),
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      timezone: 'UTC', // Must be hardcoded to 'UTC'
    });
  });

  it('성공 시 Profile ID를 반환하고 onFinish를 실행해야 한다', async () => {
    jest.useFakeTimers();

    render(<TasteAnalysisScreen onFinish={mockOnFinish} onFail={mockOnFail} />);

    await waitFor(() => {
      expect(analyzeTastePreferenceStream).toHaveBeenCalled();
    });

    // Fast-forward 1 second to fire the setTimeout callback triggering onFinish
    jest.advanceTimersByTime(1000);

    expect(mockOnFinish).toHaveBeenCalledWith('test-taste-profile-id-1234');

    jest.useRealTimers();
  });
});
