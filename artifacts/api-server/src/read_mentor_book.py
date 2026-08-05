import pandas as pd
import os

file_path = "/Users/jashwanthsingh/Downloads/MENTOR BOOK FACULTY LIST-26-27.xlsx"
df = pd.read_excel(file_path, sheet_name="23,24,25-Batches")
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)
print(df)
