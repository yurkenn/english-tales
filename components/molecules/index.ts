/**
 * Molecules - Component Aggregates
 * Organized by feature domain
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core UI Components
// ─────────────────────────────────────────────────────────────────────────────
export { ActionSheet } from './ActionSheet';
export { ConfirmationDialog } from './ConfirmationDialog';
export type { ConfirmationDialogProps } from './ConfirmationDialog';
export { EmptyState } from './EmptyState';
export { NetworkError } from './NetworkError';
export { OfflineBanner } from './OfflineBanner';

// ─────────────────────────────────────────────────────────────────────────────
// Form & Input Components
// ─────────────────────────────────────────────────────────────────────────────
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';
export { SearchBar } from './SearchBar';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Components
// ─────────────────────────────────────────────────────────────────────────────
export { AuthDivider } from './AuthDivider';
export { SocialAuthButton } from './SocialAuthButton';
export { TermsCheckbox } from './TermsCheckbox';
export { GuestLoginBanner } from './GuestLoginBanner';

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Components
// ─────────────────────────────────────────────────────────────────────────────
export { OnboardingSlide } from './OnboardingSlide';
export { OnboardingLevelSelection } from './OnboardingLevelSelection';
export { OnboardingTrackVisual } from './OnboardingTrackVisual';
export { OnboardingConnectVisual } from './OnboardingConnectVisual';
export * from './onboarding';

// ─────────────────────────────────────────────────────────────────────────────
// Story & Book Cards
// ─────────────────────────────────────────────────────────────────────────────
export { BookCard } from './BookCard';
export { BookListItem } from './BookListItem';
export { RankedStoryCard } from './RankedStoryCard';
export { StoryGridCard } from './StoryGridCard';
export { LibraryBookCard } from './LibraryBookCard';
export { DifficultyCard } from './DifficultyCard';
export { StoryMeta } from './StoryMeta';
export { StorySnippet } from './StorySnippet';
export { AuthorSpotlight } from './AuthorSpotlight';
export { AuthorSection } from './AuthorSection';

// ─────────────────────────────────────────────────────────────────────────────
// Search Components
// ─────────────────────────────────────────────────────────────────────────────
export { RecentSearches } from './RecentSearches';
export { TrendingSuggestions } from './TrendingSuggestions';
export { SearchEmptyState } from './SearchEmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Home & Discovery
// ─────────────────────────────────────────────────────────────────────────────
export { BrowseAllButton } from './BrowseAllButton';
export { SurpriseMeButton } from './SurpriseMeButton';
export { DailyGoalCard } from './DailyGoalCard';

// ─────────────────────────────────────────────────────────────────────────────
// Library Components
// ─────────────────────────────────────────────────────────────────────────────
export { LibraryFilterBadge } from './LibraryFilterBadge';
export { DownloadButton } from './DownloadButton';
export { CheckpointItem } from './CheckpointItem';
export * from './library';

// ─────────────────────────────────────────────────────────────────────────────
// Reading & Vocabulary
// ─────────────────────────────────────────────────────────────────────────────
export { VocabularyItem } from './VocabularyItem';
export { VocabularyMilestoneCard } from './VocabularyMilestoneCard';
export { FlashCard } from './FlashCard';
export { HighlightMenu } from './HighlightMenu';

// ─────────────────────────────────────────────────────────────────────────────
// Reviews & Ratings
// ─────────────────────────────────────────────────────────────────────────────
export { ReviewCard } from './ReviewCard';

// ─────────────────────────────────────────────────────────────────────────────
// Achievements & Progress
// ─────────────────────────────────────────────────────────────────────────────
export { AchievementCard } from './AchievementCard';
export { AchievementsProgressCard } from './AchievementsProgressCard';

// ─────────────────────────────────────────────────────────────────────────────
// Community & Social
// ─────────────────────────────────────────────────────────────────────────────
export { CommunityBuzz } from './CommunityBuzz';
export { FriendCircle } from './FriendCircle';
export { UserSearchModal } from './UserSearchModal';
export { FriendListItem } from './FriendListItem';
export type { FriendWithFid } from './FriendListItem';
export { CreatePostBar } from './CreatePostBar';
export { ProfileQuickView } from './ProfileQuickView';
export { NotificationList } from './NotificationList';
export { CommunityReplyCard } from './CommunityReplyCard';
export { CommentThread } from './CommentThread';
export * from './community';

// ─────────────────────────────────────────────────────────────────────────────
// Profile Components
// ─────────────────────────────────────────────────────────────────────────────
export { ProfileMenuItem } from './ProfileMenuItem';
export * from './profile';

// ─────────────────────────────────────────────────────────────────────────────
// Settings Components
// ─────────────────────────────────────────────────────────────────────────────
export { SettingItem } from './SettingItem';
export { SettingSection } from './SettingSection';
export { SettingToggle } from './SettingToggle';
export * from './settings';

// ─────────────────────────────────────────────────────────────────────────────
// Story Detail Components
// ─────────────────────────────────────────────────────────────────────────────
export { StorySelectorModal } from './StorySelectorModal';
export * from './story';

// ─────────────────────────────────────────────────────────────────────────────
// Monetization & Ads
// ─────────────────────────────────────────────────────────────────────────────
export { RewardedAdButton } from './RewardedAdButton';
export { TranslationLimitModal } from './TranslationLimitModal';
export { StoryUnlockModal } from './StoryUnlockModal';
export { StreakProtectionModal } from './StreakProtectionModal';
export { TrialTimeline } from './TrialTimeline';

// ─────────────────────────────────────────────────────────────────────────────
// Deprecated (scheduled for removal)
// ─────────────────────────────────────────────────────────────────────────────
/** @deprecated Use RankedStoryCard instead */
export { PopularStoryCard } from './PopularStoryCard';
/** @deprecated Use RankedStoryCard instead */
export { TrendingStoryCard } from './TrendingStoryCard';
