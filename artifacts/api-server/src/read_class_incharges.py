import pandas as pd
import os

file_path = "/Users/jashwanthsingh/Downloads/A.Y-26-27 SEM-I CLASS INCHARGES NAMES.xlsx"
df = pd.read_excel(file_path, sheet_name="MV-IV FLOOR")
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)
print(df)
