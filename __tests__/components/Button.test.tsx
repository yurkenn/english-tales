import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/Button';

describe('Button component', () => {
    it('renders correctly with title', () => {
        const { getByText } = render(<Button title="Test Button" onPress={() => { }} />);
        expect(getByText('Test Button')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const onPressMock = jest.fn();
        const { getByText } = render(<Button title="Press Me" onPress={onPressMock} />);

        fireEvent.press(getByText('Press Me'));
        expect(onPressMock).toHaveBeenCalled();
    });

    it('shows loading indicator when loading prop is true', () => {
        const { getByTestId } = render(<Button title="Submit" loading onPress={() => { }} />);
        // Assuming Button uses ActivityIndicator which has a default testID or we added one
        // Let's just check if it renders something different or doesn't show text if we implement it that way
        // For now, this is just a placeholder to show component testing
    });
});
