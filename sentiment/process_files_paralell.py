import os
from concurrent.futures import ProcessPoolExecutor
#from concurrent.futures import ThreadPoolExecutor
from process_csv_file import process_csv_file

DATA_SOURCE_PATH = 'processing_data/'

# Function to process a single file
def process_file(csv_file, roberta_model, vader_model):
    try:
        process_csv_file(csv_file, roberta_model, vader_model)
        print(f"Processed {csv_file}")
        return f"{csv_file} processed successfully"
    except Exception as e:
        return f"Failed to process {csv_file}: {e}"

# Wrapper function for passing multiple arguments
def process_file_wrapper(args):
    return process_file(*args)

# Main function to handle multiple files
def process_folder(roberta_model, vader_model):
    csv_files = [f for f in os.listdir(DATA_SOURCE_PATH) if f.endswith('.csv')]
    
    # Prepare arguments as tuples for each file
    tasks = [(file, roberta_model, vader_model) for file in csv_files]

    # Parallel processing with ProcessPoolExecutor
    with ProcessPoolExecutor(max_workers=8) as executor:
    # Parallel processing with ThreadPoolExecutor
    #with ThreadPoolExecutor(max_workers=15) as executor:
        results = executor.map(process_file_wrapper, tasks, chunksize=1)
    
    # Print results
    for result in results:
        print(result)

