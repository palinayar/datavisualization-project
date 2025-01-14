from RobertaModel import RobertaModel
from VaderModel import VaderModel
from process_csv_file import process_csv_file
from process_files_paralell import process_folder
import gc

def main():
    try:
        # Initialize models
        roberta_model = RobertaModel()
        if not roberta_model.Initialized:
            return "Unable to initialize ROBERTA model"
            
        vader_model = VaderModel()
        if not vader_model.Initialized:
            return "Unable to initialize VADER model"

        # For parallel processing:
        # process_folder(roberta_model, vader_model)


        # FOR SINGLE FILE PROCESSING

        # Set a CSV fiel to process:
        csv_file = 'processing_data/CAvideos_uniq.csv'
        # For single file processing:
        process_csv_file(csv_file, roberta_model, vader_model)
    finally:
        gc.collect()
        print("Resources have been released. Script completed successfully.")

if __name__ == '__main__':
    main()
