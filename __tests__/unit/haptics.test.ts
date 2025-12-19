import { haptics } from '../../utils/haptics';
import * as ExpoHaptics from 'expo-haptics';

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
    NotificationFeedbackType: {
        Success: 'success',
        Warning: 'warning',
        Error: 'error',
    },
}));

describe('haptics utility', () => {
    it('calls impactAsync with Light on light()', () => {
        haptics.light();
        expect(ExpoHaptics.impactAsync).toHaveBeenCalledWith('light');
    });

    it('calls notificationAsync with Success on success()', () => {
        haptics.success();
        expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith('success');
    });

    it('calls selectionAsync on selection()', () => {
        haptics.selection();
        expect(ExpoHaptics.selectionAsync).toHaveBeenCalled();
    });
});
