/**
 * @format
 */
import React from 'react';
import renderer from 'react-test-renderer';
import Button from '../src/components/Buttons/Button';

describe('Button', () => {
    it('renders correctly with text', () => {
        const tree = renderer.create(<Button buttonText="Kaydet" />).toJSON();
        expect(tree).toBeTruthy();
    });

    it('renders with custom width', () => {
        const tree = renderer.create(
            <Button buttonText="Giriş Yap" width={200} />
        ).toJSON();
        expect(tree).toBeTruthy();
    });

    it('renders disabled state', () => {
        const tree = renderer.create(
            <Button buttonText="Disabled" disabled />
        ).toJSON();
        expect(tree).toBeTruthy();
    });
});
