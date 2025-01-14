import array
import pandas as pd
from tqdm import tqdm
import os
import sys

# Global variables
DATA_SOURCE_PATH = 'processing_data/'
OUTPUT_PATH = 'output_uniq/'
ROWS_TO_PROCESS = sys.maxsize
# ROWS_TO_PROCESS = 1000

def process_csv_file(csv_file, roberta_model, vader_model):
    
        file_path = os.path.join(DATA_SOURCE_PATH, csv_file)
        output_file_path = os.path.join(OUTPUT_PATH, f'sentiments_{csv_file}')

        try:
            videos = pd.read_csv(file_path, encoding='utf-8-sig', encoding_errors='ignore')
            rows = len(videos)

            title_neg = array.array('f', [0.0] * rows)
            title_neu = array.array('f', [0.0] * rows)
            title_pos = array.array('f', [0.0] * rows)
            description_neg = array.array('f', [0.0] * rows)
            description_neu = array.array('f', [0.0] * rows)
            description_pos = array.array('f', [0.0] * rows)
            tags_neg = array.array('f', [0.0] * rows)
            tags_neu = array.array('f', [0.0] * rows)
            tags_pos = array.array('f', [0.0] * rows)
            tags_compund = array.array('f', [0.0] * rows)

            for i, row in tqdm(videos.iterrows(), total=rows, desc=f"Processing rows in {csv_file}"):
                if i == ROWS_TO_PROCESS:
                        break
                
                video_id = row.get('video_id', f"unknown_{i}")
                try:
                    title = row['title']
                    title = "" if pd.isna(title) else title.replace('\n', ' ').replace('|', ' ').strip()
                    description = row['description']
                    description = "" if pd.isna(description) else description.replace('\n', ' ').replace('|', ' ').strip()
                    tags = row['tags']
                    tags = "" if pd.isna(tags) else str(tags)
                    
                    neg, neu, pos = roberta_model.get_sentiment_scores(title)
                    title_neg[i] = neg
                    title_neu[i] = neu
                    title_pos[i] = pos
                    neg, neu, pos = roberta_model.get_sentiment_scores(description)
                    description_neg[i] = neg
                    description_neu[i] = neu
                    description_pos[i] = pos
                    neg, neu, pos, compound = vader_model.get_sentiment_scores(tags)
                    tags_neg[i] = neg[0]
                    tags_neu[i] = neu[0]
                    tags_pos[i] = pos[0]
                    tags_pos[i] = compound

                except RuntimeError as re:
                    print(f'RuntimeError on id {video_id}: {re}')
                except Exception as e:
                    print(f'Unexpected error for id {video_id}: {e}')

            videos.insert(1, 'title_neg', title_neg)
            videos.insert(2, 'title_neu', title_neu)
            videos.insert(3, 'title_pos', title_pos)
            videos.insert(4, 'description_neg', description_neg)
            videos.insert(5, 'description_neu', description_neu)
            videos.insert(6, 'description_pos', description_pos)
            videos.insert(7, 'tags_neg', tags_neg)
            videos.insert(8, 'tags_neu', tags_neu)
            videos.insert(9, 'tags_pos', tags_pos)
            videos.insert(9, 'tags_compound', tags_compund)

            # Save processed videos as a file
            videos.to_csv(output_file_path, index=False)
            print(f"Processed {csv_file} and saved to {output_file_path}")

        except FileNotFoundError:
                print(f"File {csv_file} not found.")
        except Exception as e:
            print(f"Failed to process {csv_file}: {e}")
