class ChangeUsers < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :auth_method, :string
  end
end
