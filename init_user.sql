-- accounts

-- webuser
DROP USER IF EXISTS 'webuser'@'localhost';
CREATE USER 'webuser'@'localhost' IDENTIFIED BY 'webuser123';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON `css326_project_airport_new`.* TO 'webuser'@'localhost';
FLUSH PRIVILEGES;

-- developer: all privileges
DROP USER IF EXISTS 'dev'@'localhost';
CREATE USER 'dev'@'localhost' IDENTIFIED BY 'dev123';
GRANT ALL PRIVILEGES ON `css326_project_airport_new`.* TO 'dev'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- manager: cannot edit schema
DROP USER IF EXISTS 'manager'@'localhost';
CREATE USER 'manager'@'localhost' IDENTIFIED BY 'manager123';
GRANT USAGE ON *.* TO 'manager'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `css326_project_airport_new`.* TO 'manager'@'localhost';
FLUSH PRIVILEGES;

-- employee: specific views
DROP USER IF EXISTS 'employee'@'localhost';
CREATE USER 'employee'@'localhost' IDENTIFIED BY 'employee123';
GRANT USAGE ON `css326_project_airport_new`.* TO 'employee'@'localhost';
GRANT SELECT ON `css326_project_airport_new`.`view_flight_info` TO 'employee'@'localhost';
GRANT SELECT ON `css326_project_airport_new`.`view_ticket_info` TO 'employee'@'localhost';
FLUSH PRIVILEGES;
