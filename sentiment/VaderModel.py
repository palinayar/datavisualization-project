from nltk.sentiment import SentimentIntensityAnalyzer
from deep_translator import GoogleTranslator
import pandas as pd

INVALID_SENTIMENT_SCORE_VADER = (-1, -1, -1, -1)

class VaderModel:
    def __init__(self):
        try:
            self.Analyzer = SentimentIntensityAnalyzer()
            self.Initialized = True
        except OSError as e:
            print(f'Unable to initialize VADER model: {e}')
            self.Initialized = False

    def get_sentiment_scores(self, text):
        try:
            if not text or pd.isna(text):
                return INVALID_SENTIMENT_SCORE_VADER

            translated_text = GoogleTranslator(source='auto', target='en').translate(text)

            if not translated_text or translated_text.strip() == "":
                return INVALID_SENTIMENT_SCORE_VADER

            scores = self.Analyzer.polarity_scores(translated_text)

            neg = scores['neg'],
            neu = scores['neu'],
            pos = scores['pos'],
            compound = scores['compound']

            return neg, neu, pos, compound

        except Exception as e:
            print(f"Error in polarity_scores_vader for text '{text}': {e}")
            return INVALID_SENTIMENT_SCORE_VADER