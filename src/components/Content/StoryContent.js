// src/components/Content/StoryContent.js
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, fontSizes, spacing, moderateScale } from '../../utils/dimensions';

const VocabularyWord = ({ word }) => (
  <View style={styles.vocabularyCard}>
    <View style={styles.wordHeader}>
      <Text style={styles.word}>{word.word}</Text>
      {word.pronunciation && <Text style={styles.pronunciation}>/{word.pronunciation}/</Text>}
    </View>

    {word.definition && <Text style={styles.definition}>{word.definition}</Text>}

    {word.example && (
      <View style={styles.exampleContainer}>
        <Text style={styles.example}>{word.example}</Text>
      </View>
    )}
  </View>
);

const GrammarPoint = ({ item }) =>
  item && (
    <View style={styles.grammarCard}>
      <View style={styles.grammarHeader}>
        <View style={styles.grammarIconContainer}>
          <Icon name="bulb-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.grammarContent}>
          <Text style={styles.grammarText}>{item}</Text>
        </View>
      </View>
    </View>
  );

const InteractiveElement = ({ element }) => {
  switch (element.type) {
    case 'quiz':
      return (
        <View style={styles.quizContainer}>
          <LinearGradient
            colors={[Colors.primary + '20', Colors.dark900]}
            style={styles.quizGradient}
          >
            <Text style={styles.quizQuestion}>{element.question}</Text>
            <View style={styles.optionsContainer}>
              {element.options.map((option, index) => (
                <TouchableOpacity key={index} style={styles.optionButton} onPress={() => {}}>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </View>
      );
    case 'note':
      return (
        <View style={styles.noteContainer}>
          <Icon name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.noteText}>{element.content}</Text>
        </View>
      );
    default:
      return null;
  }
};

const TextBlock = ({ block, fontSize }) => {
  if (!block || !block.children) {
    return null;
  }

  const renderChild = (child, index) => {
    if (!child) return null;
    if (typeof child === 'string') return child;

    const marks = child.marks || [];
    let content = child.text || '';

    // Apply text decorations based on marks
    if (marks.includes('strong')) {
      content = (
        <Text key={index} style={styles.bold}>
          {content}
        </Text>
      );
    }
    if (marks.includes('em')) {
      content = (
        <Text key={index} style={styles.italic}>
          {content}
        </Text>
      );
    }
    if (marks.includes('highlight')) {
      content = (
        <Text key={index} style={styles.highlight}>
          {content}
        </Text>
      );
    }
    if (child._type === 'vocabularyReference') {
      content = (
        <Text key={index} style={styles.vocabularyLink}>
          {content}
        </Text>
      );
    }

    return content;
  };

  const renderChildren = (children) => {
    if (!Array.isArray(children)) return null;
    return children.map(renderChild);
  };

  switch (block.style) {
    case 'h1':
      return <Text style={styles.h1}>{renderChildren(block.children)}</Text>;
    case 'h2':
      return <Text style={styles.h2}>{renderChildren(block.children)}</Text>;
    case 'blockquote':
      return (
        <View style={styles.blockquote}>
          <Text style={styles.blockquoteText}>{renderChildren(block.children)}</Text>
        </View>
      );
    default:
      // For first paragraph, render with special first-letter styling
      if (block.children?.[0]?.text) {
        const firstChar = block.children[0].text.charAt(0);
        const restOfFirstWord = block.children[0].text.slice(1);

        return (
          <Text style={[styles.paragraph, { fontSize }]}>
            <Text style={[styles.firstLetter, { fontSize: fontSize * 2 }]}>{firstChar}</Text>
            {restOfFirstWord}
            {renderChildren(block.children.slice(1))}
          </Text>
        );
      } else {
        return (
          <Text style={[styles.paragraph, { fontSize }]}>{renderChildren(block.children)}</Text>
        );
      }
  }
};

const StoryContent = ({
  blocks = [],
  vocabulary = [],
  grammarFocus = [],
  interactiveElements = [],
  fontSize = fontSizes.md,
}) => {
  const renderContent = () => {
    if (!Array.isArray(blocks)) return null;
    
    return blocks.map((block, index) => {
      if (!block) return null;
      
      // Check if there's an interactive element that should be inserted here
      const interactiveElement = Array.isArray(interactiveElements) 
        ? interactiveElements.find((element) => element?.position === index)
        : null;

      return (
        <React.Fragment key={block._key || index}>
          <TextBlock block={block} fontSize={fontSize} />
          {interactiveElement && <InteractiveElement element={interactiveElement} />}
        </React.Fragment>
      );
    });
  };

  return (
    <View style={styles.container}>
      {renderContent()}

      {Array.isArray(vocabulary) && vocabulary.length > 0 && (
        <View style={styles.vocabularySection}>
          <Text style={styles.sectionTitle}>Vocabulary</Text>
          {vocabulary.map((word, index) => (
            word ? <VocabularyWord key={index} word={word} /> : null
          ))}
        </View>
      )}

      {Array.isArray(grammarFocus) && grammarFocus.length > 0 && (
        <View style={styles.grammarSection}>
          <Text style={styles.sectionTitle}>Grammar Focus</Text>
          {grammarFocus.map((item, index) => (
            item ? <GrammarPoint key={index} item={item} /> : null
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  // Text Styles
  paragraph: {
    color: Colors.white,
    lineHeight: moderateScale(40),
    marginBottom: spacing.xs,
    fontFamily: 'serif',
  },
  firstLetter: {
    fontWeight: '700',
    fontFamily: 'serif',
  },
  h1: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginVertical: spacing.lg,
    fontFamily: 'serif',
  },
  h2: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginVertical: spacing.md,
    fontFamily: 'serif',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  highlight: {
    backgroundColor: Colors.primary + '30',
    color: Colors.primary,
  },
  vocabularyLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  // Blockquote Styles
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingLeft: spacing.md,
    marginVertical: spacing.lg,
  },
  blockquoteText: {
    color: Colors.gray300,
    fontStyle: 'italic',
    fontSize: fontSizes.md,
    lineHeight: moderateScale(24),
  },
  // Vocabulary Section Styles
  vocabularySection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  vocabularyCard: {
    backgroundColor: Colors.dark800,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  word: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: spacing.sm,
  },
  pronunciation: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    fontStyle: 'italic',
  },
  definition: {
    fontSize: fontSizes.md,
    color: Colors.white,
    marginBottom: spacing.sm,
    lineHeight: moderateScale(22),
  },
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  quoteIcon: {
    marginRight: spacing.xs,
    marginTop: spacing.xs,
  },
  example: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    fontStyle: 'italic',
    lineHeight: moderateScale(20),
  },
  // Grammar Section Styles
  grammarSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.md,
  },
  grammarCard: {
    backgroundColor: Colors.dark800,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  grammarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  grammarIconContainer: {
    marginRight: spacing.sm,
    paddingTop: 2,
  },
  grammarContent: {
    flex: 1,
  },
  grammarText: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    lineHeight: moderateScale(22),
  },
  grammarExample: {
    backgroundColor: Colors.dark900,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  exampleText: {
    fontSize: fontSizes.sm,
    color: Colors.white,
    fontStyle: 'italic',
  },
  // Interactive Elements Styles
  quizContainer: {
    marginVertical: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quizGradient: {
    padding: spacing.lg,
  },
  quizQuestion: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: Colors.dark800,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark500,
  },
  optionText: {
    fontSize: fontSizes.md,
    color: Colors.white,
    textAlign: 'center',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary + '15',
    padding: spacing.md,
    borderRadius: 8,
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: Colors.white,
    lineHeight: moderateScale(20),
  },
});

export default StoryContent;
