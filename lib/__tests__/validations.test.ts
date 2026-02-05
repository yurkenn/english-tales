import { reviewSchema, userProfileSchema, searchSchema, readingProgressSchema, loginSchema, signupSchema } from '../validations';

describe('Validations', () => {
    describe('reviewSchema', () => {
        it('validates a valid review', () => {
            const result = reviewSchema.safeParse({
                rating: 5,
                text: 'This is a great story!',
            });
            expect(result.success).toBe(true);
        });

        it('fails if rating is out of range', () => {
            const result = reviewSchema.safeParse({
                rating: 6,
                text: 'This is a great story!',
            });
            expect(result.success).toBe(false);
        });

        it('fails if text is too short', () => {
            const result = reviewSchema.safeParse({
                rating: 5,
                text: 'Short',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('userProfileSchema', () => {
        it('validates a valid profile', () => {
            const result = userProfileSchema.safeParse({
                displayName: 'John Doe',
                email: 'john@example.com',
                photoURL: 'https://example.com/photo.jpg',
            });
            expect(result.success).toBe(true);
        });

        it('validates a profile without photoURL', () => {
            const result = userProfileSchema.safeParse({
                displayName: 'John Doe',
                email: 'john@example.com',
            });
            expect(result.success).toBe(true);
        });

         it('validates a profile with empty string photoURL', () => {
            const result = userProfileSchema.safeParse({
                displayName: 'John Doe',
                email: 'john@example.com',
                photoURL: '',
            });
            expect(result.success).toBe(true);
        });

        it('fails if email is invalid', () => {
            const result = userProfileSchema.safeParse({
                displayName: 'John Doe',
                email: 'invalid-email',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('searchSchema', () => {
        it('validates a valid search query', () => {
            const result = searchSchema.safeParse({
                query: 'fairy tale',
            });
            expect(result.success).toBe(true);
        });

        it('fails if query is too short', () => {
            const result = searchSchema.safeParse({
                query: 'a',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('readingProgressSchema', () => {
        it('validates valid reading progress', () => {
            const result = readingProgressSchema.safeParse({
                storyId: '123',
                currentPage: 5,
                totalPages: 10,
                lastReadAt: new Date(),
            });
            expect(result.success).toBe(true);
        });

        it('fails if currentPage is negative', () => {
            const result = readingProgressSchema.safeParse({
                storyId: '123',
                currentPage: -1,
                totalPages: 10,
                lastReadAt: new Date(),
            });
            expect(result.success).toBe(false);
        });
    });

    describe('loginSchema', () => {
        it('validates valid login data', () => {
            const result = loginSchema.safeParse({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result.success).toBe(true);
        });

        it('fails if password is too short', () => {
             const result = loginSchema.safeParse({
                email: 'test@example.com',
                password: '123',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('signupSchema', () => {
        it('validates valid signup data', () => {
            const result = signupSchema.safeParse({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result.success).toBe(true);
        });

        it('fails if name is too short', () => {
             const result = signupSchema.safeParse({
                name: 'A',
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result.success).toBe(false);
        });
    });
});
