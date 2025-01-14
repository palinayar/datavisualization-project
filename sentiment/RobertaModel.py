from transformers import AutoTokenizer, AutoModelForSequenceClassification
from scipy.special import softmax

INVALID_SENTIMENT_SCORE_ROBERTA = (-1, -1, -1)

class RobertaModel:
    def __init__(self):
    
        roberta_model = "cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual"

        # Load the tokenizer and model for ROBERTA
        try:
            self.Tokenizer = AutoTokenizer.from_pretrained(roberta_model)
            self.Model = AutoModelForSequenceClassification.from_pretrained(roberta_model)
           
            print("Model and tokenizer loaded successfully!")
            self.Initialized = True
        except OSError as e:
            print(f"Failed to init model = {self.Model}, tokenizer = {self.Tokenizer}")
            self.Initialized = False

    def get_sentiment_scores(self, text):
        try:
            if not text:
                return INVALID_SENTIMENT_SCORE_ROBERTA
            
            encoded_text = self.Tokenizer(
                text,
                return_tensors='pt',
                max_length=512,
                padding='max_length',
                truncation=True
            )

            # If for some reason no tokens
            if encoded_text['input_ids'].shape[-1] == 0:
                print("No tokens found for text.")
                return INVALID_SENTIMENT_SCORE_ROBERTA

            output = self.Model(**encoded_text)

            scores = output.logits.squeeze().detach().cpu().numpy()
            scores = softmax(scores)

            # Check shape
            if scores.shape != (3,):
                print(f"Skipping text due to unexpected shape {scores.shape}")
                return INVALID_SENTIMENT_SCORE_ROBERTA

            neg =  round(float(scores[0]), 4)
            neu =  round(float(scores[1]), 4)
            pos =  round(float(scores[2]), 4)

            return neg, neu, pos

        except Exception as e:
            print(f"Error in polarity_scores_roberta for type {type} on example '{text}': {e}")
            return INVALID_SENTIMENT_SCORE_ROBERTA